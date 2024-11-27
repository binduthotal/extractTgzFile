// Assuming Tar.js and pako are properly loaded
// The processFiles function (your provided function)
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

// Function to handle file extraction
function handleFileExtract(event) {
  event.preventDefault();

  const fileInput = document.getElementById("fileUpload");
  const fileOutput = document.getElementById("output");

  const file = fileInput.files[0];

  if (!file) {
    console.error("No file selected");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      console.log("file: ",reader.result);
      
      // Decompress the .tgz file using pako
      const compressedData = new Uint8Array(reader.result);
      console.log("Compressed data: " , compressedData);
      
      const decompressedData = pako.inflate(compressedData);
      console.log("Decompressed data:", decompressedData);

      // Extract files using Tar.extract
      const extractedFiles = Tar.extract(decompressedData);
      console.log("Extracted files:", extractedFiles);

      // Process the extracted files using processFiles
      const processedData = processFiles(extractedFiles); // Now process the files

      // Process and display extracted content
      if (Array.isArray(extractedFiles) && extractedFiles.length > 0) {
        let output = "";
        extractedFiles.forEach((file) => {
          const content = new TextDecoder().decode(file.buffer);
          output += `File: ${file.name}\nContent: ${content}\n\n`;
        });

        fileOutput.textContent = output;
      } else {
        throw new Error(
          "No files extracted or extractedFiles is not an array."
        );
      }

      // Optionally, you can display or further handle the processed data (e.g., 'processedData')
      console.log("Processed Data:", processedData);
    } catch (error) {
      console.error("Error processing .tgz file:", error);
      fileOutput.textContent = `Error: ${error.message}`;
    }
  };

  reader.onerror = () => {
    console.error("Error reading file:", reader.error);
    fileOutput.textContent = `Error reading file: ${reader.error}`;
  };

  // Read the file as an ArrayBuffer
  reader.readAsArrayBuffer(file);
}
