.PHONY: themes

themes:
	git clone https://github.com/mcrwfrd/hugo-frances-theme.git themes/frances || echo Exists

serve:
	hugo server -D

sync-ig:
	tsc code/download/download_instagram.ts && \
	node code/download/download_instagram.js artwork