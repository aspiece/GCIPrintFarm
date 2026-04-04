# Intro to 3D Printing – 5-Day Training Guide

**GCI | Bambu Lab A1 / A1 Mini / P1S**

This directory contains the five-day student training guide for the GCI 3D printing lab. Each day builds on the previous one, taking students from core concepts all the way through a final capstone project.

---

## 📅 Daily Schedule

| Day | Focus | Link |
|-----|-------|------|
| Day 1 | **Foundations of 3D Printing** – How printers work, key parts, filament types, and MakerWorld exploration | [Open Day 1](Intro_to_3D_Printing_Day1.html) |
| Day 2 | **Introduction to the Printers** – Bambu A1, A1 Mini, and P1S comparison; observation activity; spool refill | [Open Day 2](Intro_to_3D_Printing_Day2.html) |
| Day 3 | **Slice and Start Your Print** – Bambu Studio slicing basics, layer preview, and submitting a print-ready file | [Open Day 3](Intro_to_3D_Printing_Day3.html) |
| Day 4 | **Troubleshoot and Reflect** – Inspect finished prints, diagnose common issues, and document results | [Open Day 4](Intro_to_3D_Printing_Day4.html) |
| Day 5 | **Capstone – Remix and Improve** – Redesign or remix your model, present your work, and plan next steps | [Open Day 5](Intro_to_3D_Printing_Day5.html) |

---

## 🗂 File Structure

```
training/
├── README.md                          ← You are here
├── lab.css                            ← Shared stylesheet for all pages
├── training.js                        ← Shared JavaScript (theme switcher, quiz renderer)
├── Intro_to_3D_Printing_Day1.html
├── Intro_to_3D_Printing_Day2.html
├── Intro_to_3D_Printing_Day3.html
├── Intro_to_3D_Printing_Day4.html
└── Intro_to_3D_Printing_Day5.html
```

---

## 🎨 Shared Assets

### `lab.css`
Single stylesheet used by all five day pages. Includes:
- CSS custom properties for dark, light, and high-contrast themes
- Layout components: `.hero`, `.wrap`, `.sticky-progress`, `.day-btn`
- Typography, form inputs, quiz components, and progress bar
- Responsive breakpoints for mobile screens

### `training.js`
Shared JavaScript loaded by all five day pages. Includes:
- **Theme switcher** – reads from `#theme-selector` and persists to `localStorage`
- **`renderQuiz(containerId, questions)`** – generic one-question-at-a-time quiz renderer used by Day 2

---

## ♿ Accessibility Features

- Dark, Light, and High Contrast themes on every page
- Font size controls on Day 1 (Default / Large / Extra Large)
- `aria-label` attributes on navigation and landmark elements
- Keyboard-navigable focus styles on all interactive elements
- Progress saved to `localStorage` so students can refresh without losing work

---

## 🖨 Printers Used

- **Bambu Lab A1** – Large build volume, multi-color support
- **Bambu Lab A1 Mini** – Compact, fast, easy to use
- **Bambu Lab P1S** – Enclosed chamber, high-temp capable

---

## 🔗 Related Files

| File | Description |
|------|-------------|
| [`../Intro_to_3D_Printing.html`](../Intro_to_3D_Printing.html) | All-in-one tabbed guide (alternative format) |
| [`../Intro_to_3D_Printing_Orientation.html`](../Intro_to_3D_Printing_Orientation.html) | Pre-lab orientation activities |
| [`../Digital_3D_Printing_Notebook_Bambu_A1.html`](../Digital_3D_Printing_Notebook_Bambu_A1.html) | Student digital notebook |
| [`../GCI3Dorder.html`](../GCI3Dorder.html) | 3D print order form |
| [`../Invoice_Generator.html`](../Invoice_Generator.html) | Invoice generator |
