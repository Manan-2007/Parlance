"""Landmark conv-transformer for isolated ISL word recognition.

Input is the backend's 135-value per-frame hand feature (backend/model.py
`frame_features`), sampled at roughly 10 Hz, plus a validity mask. The browser,
backend and training therefore share one representation; nothing here needs
camera images, pose or depth beyond MediaPipe's hand landmarks.

`torch_frame_features` is a batched, differentiable-free re-implementation of
`frame_features` used to augment raw landmarks on the GPU during training.
`training/tests/test_isl_transformer.py` checks the two agree.
"""
import math

import torch
from torch import nn

FRAME_SIZE = 135
NONE_LABEL = '__NONE__'


def torch_frame_features(points: torch.Tensor) -> torch.Tensor:
    """points (..., 2, 21, 3) raw normalized image landmarks -> (..., 135)."""
    shape = points.shape[:-3]
    points = points.reshape(-1, 2, 21, 3).float()
    present = (points != 0).flatten(2).any(-1)                        # (N, 2)
    wrist_x = torch.where(present, points[:, :, 0, 0], torch.full_like(points[:, :, 0, 0], math.inf))
    order = torch.argsort(wrist_x, dim=1, stable=True)                # present hands first, by wrist x
    points = torch.gather(points, 1, order[:, :, None, None].expand(-1, -1, 21, 3))
    present = torch.gather(present, 1, order)
    wrist = points[:, :, :1]
    relative = points - wrist
    scale = relative.norm(dim=-1).amax(-1)                            # (N, 2)
    valid = present & (scale >= 1e-6)
    shapes = relative / scale.clamp_min(1e-6)[:, :, None, None]
    shapes = torch.where(valid[:, :, None, None], shapes, torch.zeros_like(shapes))
    result = torch.zeros(points.shape[0], FRAME_SIZE, device=points.device)
    result[:, :126] = shapes.reshape(-1, 126)
    result[:, 126:128] = valid.float()
    result[:, 128:132] = torch.where(valid[:, :, None], wrist[:, :, 0, :2], torch.zeros_like(wrist[:, :, 0, :2])).reshape(-1, 4)
    both = valid.all(1)
    relation = ((points[:, 1, 0] - points[:, 0, 0]) / scale.mean(1, keepdim=True).clamp_min(1e-6)).clamp(-12, 12)
    result[:, 132:135] = torch.where(both[:, None], relation, torch.zeros_like(relation))
    return result.reshape(*shape, FRAME_SIZE)


class ConvBlock(nn.Module):
    def __init__(self, dim, kernel=11, drop=0.1):
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.expand = nn.Linear(dim, dim * 2)
        self.depthwise = nn.Conv1d(dim, dim, kernel, padding=kernel // 2, groups=dim)
        self.norm2 = nn.LayerNorm(dim)
        self.project = nn.Linear(dim, dim)
        self.drop = nn.Dropout(drop)

    def forward(self, x, mask):
        y = self.norm(x)
        a, b = self.expand(y).chunk(2, -1)
        y = (a * torch.sigmoid(b)) * mask[..., None]
        y = self.depthwise(y.transpose(1, 2)).transpose(1, 2)
        y = self.project(nn.functional.silu(self.norm2(y)))
        return (x + self.drop(y)) * mask[..., None]


class AttentionBlock(nn.Module):
    def __init__(self, dim, heads=4, drop=0.1):
        super().__init__()
        self.heads = heads
        self.norm = nn.LayerNorm(dim)
        self.qkv = nn.Linear(dim, dim * 3)
        self.out = nn.Linear(dim, dim)
        self.norm2 = nn.LayerNorm(dim)
        self.ffn = nn.Sequential(nn.Linear(dim, dim * 2), nn.SiLU(), nn.Dropout(drop), nn.Linear(dim * 2, dim))
        self.drop = nn.Dropout(drop)

    def forward(self, x, mask):
        b, t, d = x.shape
        q, k, v = self.qkv(self.norm(x)).reshape(b, t, 3, self.heads, d // self.heads).permute(2, 0, 3, 1, 4)
        scores = (q @ k.transpose(-1, -2)) / math.sqrt(d // self.heads)
        scores = scores.masked_fill(mask[:, None, None, :] < 0.5, -1e4)
        y = (scores.softmax(-1) @ v).transpose(1, 2).reshape(b, t, d)
        x = x + self.drop(self.out(y))
        x = x + self.drop(self.ffn(self.norm2(x)))
        return x * mask[..., None]


class SignTransformer(nn.Module):
    """(B, T, 135) features + (B, T) mask -> (B, classes) logits."""

    def __init__(self, classes, dim=192, depth=3, drop=0.1, head_drop=0.3):
        super().__init__()
        self.stem = nn.Sequential(nn.Linear(FRAME_SIZE * 2, dim), nn.LayerNorm(dim))
        layers = []
        for _ in range(depth):
            layers += [ConvBlock(dim, drop=drop), ConvBlock(dim, drop=drop), AttentionBlock(dim, drop=drop)]
        self.layers = nn.ModuleList(layers)
        self.norm = nn.LayerNorm(dim)
        self.head = nn.Sequential(nn.Dropout(head_drop), nn.Linear(dim * 2, classes))

    def forward(self, features, mask):
        mask = mask.float()
        previous = torch.cat((features[:, :1], features[:, :-1]), 1)
        prev_mask = torch.cat((mask[:, :1], mask[:, :-1]), 1)
        delta = (features - previous) * (mask * prev_mask)[..., None]
        x = self.stem(torch.cat((features, delta), -1)) * mask[..., None]
        for layer in self.layers:
            x = layer(x, mask)
        x = self.norm(x) * mask[..., None]
        count = mask.sum(1, keepdim=True).clamp_min(1)
        mean = x.sum(1) / count
        peak = x.masked_fill(mask[..., None] < 0.5, -1e4).amax(1)
        return self.head(torch.cat((mean, peak), -1))
