#!/usr/bin/env bash
set -e

# Kullanım:
#   ./deploy.sh "commit mesajı"
#
# Bu script yerel bilgisayarında çalıştırılır. ChatGPT doğrudan GitHub'a push atamaz.

MSG="${1:-Soru bankası güncellemesi}"

git add .
git commit -m "$MSG"
git push