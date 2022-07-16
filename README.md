# pano-web-template

A quick'n'dirty map+panorama mashup website. See https://pano.zarovi.cz/ for a particular installation (hosted via GitHub Pages). If you wish to host your own images, do the following:

  1. fork the repo
  1. setup a proper hosting (the project aims for GitHub Pages, alternatively with a custom domain via a CNAME file)
  1. drop your images into the `img/` folder
  
 The metadata file (`data.json`) should be generated automatically via GitHub Actions. You can do this manually by invoking `make` (this also renames your files).
 
