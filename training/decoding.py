"""CTC decoding and corpus word-error metrics without a language model."""


def collapse_ctc(path, blank=0):
    result, previous = [], blank
    for token in path:
        token = int(token)
        if token != blank and token != previous:
            result.append(token)
        previous = token
    return result


def edit_counts(reference, hypothesis):
    """Return substitutions, deletions, insertions with a stable tie break."""
    rows = [[(0, 0, j) for j in range(len(hypothesis) + 1)]]
    for i, target in enumerate(reference, 1):
        row = [(0, i, 0)]
        for j, predicted in enumerate(hypothesis, 1):
            if target == predicted:
                row.append(rows[-1][j - 1])
            else:
                s, d, ins = rows[-1][j - 1]
                candidates = [(s + 1, d, ins)]
                s, d, ins = rows[-1][j]
                candidates.append((s, d + 1, ins))
                s, d, ins = row[-1]
                candidates.append((s, d, ins + 1))
                row.append(min(candidates, key=sum))
        rows.append(row)
    return rows[-1][-1]


def corpus_metrics(references, hypotheses):
    if len(references) != len(hypotheses):
        raise ValueError('Every reference needs one hypothesis')
    substitutions = deletions = insertions = words = exact = 0
    for reference, hypothesis in zip(references, hypotheses):
        s, d, i = edit_counts(reference, hypothesis)
        substitutions += s
        deletions += d
        insertions += i
        words += len(reference)
        exact += list(reference) == list(hypothesis)
    return {'wordErrorRate': (substitutions + deletions + insertions) / max(words, 1),
            'sequenceAccuracy': exact / max(len(references), 1), 'referenceWords': words,
            'sequences': len(references), 'substitutions': substitutions,
            'deletions': deletions, 'insertions': insertions}
