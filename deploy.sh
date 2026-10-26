#!/bin/sh
# 배포: 정적 파일 주소에 ?v=<시각> 을 붙여 브라우저 캐시를 무효화한 뒤 커밋 + 푸시
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
for f in *.html; do
  sed -E -i '' "s#(src|href)=\"([a-z/.]+\.(js|css))(\?v=[0-9]+)?\"#\1=\"\2?v=$V\"#g" "$f"
done
git add -A
git commit -qm "${1:-Deploy} (v$V)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
git push -q
echo "deployed v$V"
