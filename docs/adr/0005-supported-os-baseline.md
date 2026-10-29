# ADR 0005 — Supported OS Baseline

Status: Accepted

## Context

The product needs broad device reach but must stay within the selected Expo SDK support matrix.

## Decision

Target Android 8+ and iOS 16.4+, matching the Expo SDK 58 support matrix and subject to verification against native dependencies.

## Consequences

Android 8+ and iOS 16.4+ compatibility with Expo SDK 58 is the implementation baseline. iOS 15 is no longer a supported target. The device matrix remains a regression requirement.
