package main

// you need the image package, and a format package for encoding/decoding
import (
	"fmt"
	"github.com/nfnt/resize"
	"golang.org/x/sync/errgroup"
	"image/png"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	err := importImages("/Users/ilackarms/Downloads/igpng/", "img")
	if err != nil {
		log.Fatal(err)
	}
}

func openOrTouch(file string) (*os.File, error) {
	f, err := os.OpenFile(file, os.O_RDWR, 0644)
	if err != nil && os.IsNotExist(err) {
		return os.Create(file)
	}
	return f, err
}

func importImages(dir, destDir string) error {
	if err := os.MkdirAll(destDir, 0777); err != nil {
		return err
	}

	count := 0

	g := errgroup.Group{}

	return filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if !strings.HasSuffix(path, ".png") {
			return nil
		}
		count++
		name := filepath.Join(destDir, fmt.Sprintf("%v.png", count))
		thumbName := filepath.Join(destDir, fmt.Sprintf("%v-thumb.png", count))

		original, err := openOrTouch(path)
		if err != nil {
			return err
		}
		defer original.Close()

		thumb, err := openOrTouch(thumbName)
		if err != nil {
			return err
		}
		defer thumb.Close()

		g.Go(func() error {
			b, err := ioutil.ReadFile(path)
			if err != nil {
				return err
			}
			return ioutil.WriteFile(name, b, 0644)
		})

		g.Go(func() error {

			// Decoding gives you an Image.
			// If you have an io.Reader already, you can give that to Decode
			// without reading it into a []byte.
			image, err := png.Decode(original)
			if err != nil {
				return err
			}

			newImage := resize.Resize(160, 0, image, resize.Lanczos3)

			// Encode uses a Writer, use a Buffer if you need the raw []byte
			//err = png.Encode(thumb, newImage)
			err = png.Encode(thumb, newImage)
			if err != nil {
				return err
			}
			return nil
		})

		return g.Wait()
	})
}
