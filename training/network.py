"""Compact causal temporal encoder shared by pretraining and CTC recognition."""
import torch
from torch import nn
from torch.nn import functional as F


class TemporalBlock(nn.Module):
    def __init__(self, channels, dilation, dropout=0.1):
        super().__init__()
        self.left_padding = 2 * dilation
        self.norm = nn.LayerNorm(channels)
        self.temporal = nn.Conv1d(channels, channels, 3, dilation=dilation, groups=channels)
        self.mix = nn.Conv1d(channels, channels, 1)
        self.dropout = nn.Dropout(dropout)

    def forward(self, values):
        normalized = self.norm(values.transpose(1, 2)).transpose(1, 2)
        hidden = self.temporal(F.pad(normalized, (self.left_padding, 0)))
        return values + self.dropout(self.mix(F.gelu(hidden)))


class TemporalEncoder(nn.Module):
    def __init__(self, features=369, channels=128):
        super().__init__()
        self.project = nn.Sequential(nn.Linear(features, channels), nn.LayerNorm(channels), nn.GELU())
        self.blocks = nn.Sequential(*(TemporalBlock(channels, dilation) for dilation in (1, 2, 4, 8, 16, 32)))

    def forward(self, frames):
        hidden = self.project(frames).transpose(1, 2)
        return self.blocks(hidden).transpose(1, 2)


class IsolatedPretrainingModel(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.encoder = TemporalEncoder()
        self.classifier = nn.Linear(256, classes)

    def forward(self, frames):
        hidden = self.encoder(frames)
        pooled = torch.cat((hidden.mean(dim=1), hidden.max(dim=1).values), dim=1)
        return self.classifier(pooled)


class ContinuousRecognizer(nn.Module):
    def __init__(self, classes):
        super().__init__()
        self.encoder = TemporalEncoder()
        self.classifier = nn.Linear(128, classes)

    def forward(self, frames):
        return self.classifier(self.encoder(frames))
