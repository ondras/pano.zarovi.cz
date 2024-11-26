DIR := img

all: data.json

webp:
	for i in *.jpg; do convert -quality 75 -define webp:method=6 "$$i" "$$i".webp; exiftool -overwrite_original -tagsfromfile "$$i" "$$i".webp; done

data.json: img rename
	exiftool -d %s -gps*# -gimbal* -flight* -imagedescription -createdate -json $(DIR)/* > $@

rename:
	exiftool -d %Y%m%d_%H%M%S%%-c.%%le "-filename<CreateDate" $(DIR)/*

check:
	git diff --name-only HEAD^ HEAD | grep -q $(DIR)/

.PHONY: check rename all webp
