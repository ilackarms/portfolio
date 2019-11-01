.PHONY: themes

themes:
	git clone https://github.com/mcrwfrd/hugo-frances-theme.git themes/frances || echo Exists

serve:
	hugo server -D