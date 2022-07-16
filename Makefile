DIR := img

all: data.json

data.json: img rename
	exiftool -d %s -gps*# -gimbal* -imagedescription -createdate -json $(DIR)/*.jpg > $@

rename:
	exiftool -d %Y%m%d_%H%M%S%%-c.%%le "-filename<CreateDate" $(DIR)

check:
	git diff --name-only HEAD^ HEAD | grep -q $(DIR)/

.PHONY: check rename
