---
name: pdflatex
description: PDFLaTeX installation and usage for converting LaTeX sources to PDF. Essential for academic publishing and research paper generation. Use when working with LaTeX documents, academic papers, or PDF generation from TeX sources.
---

# PDFLaTeX Expert

## When to Use This Skill

Activate when working with:
- LaTeX document compilation
- Academic paper publishing
- PDF generation from LaTeX
- TeX installation and configuration

## Installation

PDFLaTeX is part of TexLive. Install on Debian/Ubuntu:

### Install TexLive Base
```bash
apt-get install texlive-latex-base
```

### Install Fonts (Recommended)
```bash
# Recommended fonts to avoid errors
apt-get install texlive-fonts-recommended

# Extra fonts for advanced documents
apt-get install texlive-fonts-extra
```

### Install Extra Packages
```bash
# Additional LaTeX packages
apt-get install texlive-latex-extra
```

## Usage

### Compile LaTeX to PDF

Basic compilation:
```bash
pdflatex document.tex
```

This creates `document.pdf` from `document.tex`.

### Full Build Process

LaTeX may need multiple runs for references and bibliography:

```bash
# Run pdflatex first time
pdflatex document.tex

# Run bibtex for bibliography (if using)
bibtex document

# Run pdflatex again for references
pdflatex document.tex

# Final run to resolve all references
pdflatex document.tex
```

### Common Options

```bash
# Specify output directory
pdflatex -output-directory=build document.tex

# Interaction mode (nonstopmode for scripts)
pdflatex -interaction=nonstopmode document.tex

# Draft mode (faster compilation, no images)
pdflatex -draftmode document.tex
```

## Troubleshooting

### Missing Packages
If you get "File 'package.sty' not found":
```bash
# Search for package
apt-cache search texlive package-name

# Install the package
apt-get install texlive-package-name
```

### Font Errors
If you encounter font-related errors:
```bash
# Install font packages
apt-get install texlive-fonts-recommended texlive-fonts-extra
```

### Permissions
Ensure you have write permissions in the directory.

## Example LaTeX Document

```latex
\documentclass{article}
\usepackage{graphicx}
\title{My Paper}
\author{Author Name}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}
This is my research paper.

\section{Methods}
Detailed methods here.

\bibliographystyle{plain}
\bibliography{references}
\end{document}
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pdflatex file.tex` | Compile to PDF |
| `pdflatex -interaction=nonstopmode file.tex` | Non-interactive mode |
| `bibtex file` | Process bibliography |

## Resources

- LaTeX Project: https://www.latex-project.org/
- TexLive Documentation: https://www.tug.org/texlive/
- Reference: http://kkpradeeban.blogspot.com/2014/04/installing-latexpdflatex-on-ubuntu.html
