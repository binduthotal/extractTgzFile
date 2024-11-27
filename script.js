// Assuming this code is inside a script that's handling file processing
const processFiles = (files) => {
  if (!Array.isArray(files)) {
    console.error("Expected 'files' to be an array, but it was:", files);
    return new Uint8Array(0); // Return an empty Uint8Array if files is not an array
  }

  return files.reduce((a, f) => {
    if (typeof f.content === "string") {
      f.content = stringToUint8(f.content);
    }

    f = Object.assign(defaults(f), f);

    if (typeof bsize !== "number" || isNaN(bsize)) {
      console.error("Invalid bsize:", bsize);
      return a;
    }

    const b = new Uint8Array(Math.ceil((bsize + f.size) / bsize) * bsize);

    const checksum = Object.keys(headers).reduce((acc, k) => {
      if (!(k in f)) return acc;

      const value = stringToUint8(
        nopad.indexOf(k) > -1 ? f[k] : pad(f[k], headers[k] - 1)
      );

      if (value) {
        b.set(value, offsets[k]);
        return acc + value.reduce((sum, byte) => sum + byte, 0);
      } else {
        console.error(`Missing value for key: ${k}`);
        return acc;
      }
    }, 0);

    if (checksum) {
      b.set(stringToUint8(pad(checksum, 7)), offsets.chksum);
    } else {
      console.error("Invalid checksum.");
    }

    if (f.content) {
      b.set(f.content, bsize);
    } else {
      console.error("Missing content in file:", f);
    }

    const sum = new Uint8Array(a.byteLength + b.byteLength);
    sum.set(a, 0);
    sum.set(b, a.byteLength);

    return sum;
  }, new Uint8Array(0));
};

// You can call this function when you have the `files` array available
// For example, on file upload or after file extraction
