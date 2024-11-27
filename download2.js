const pako = require("pako"); // For decompression
const tar = require("tar-stream"); // For .tar extraction

// Function to process .tgz files
function handleFileExtract(event) {
  event.preventDefault();

  const fileInput = document.getElementById("fileUpload");
  const fileOutput = document.getElementById("output");

  const file = fileInput.files[0];

  if (!file) {
    console.error("No file selected");
    fileOutput.textContent = "Please select a file.";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      // Decompress the .tgz file using pako
      const compressedData = new Uint8Array(reader.result);
      const decompressedData = pako.inflate(compressedData);
      console.log("Decompressed data:", decompressedData);

      // Create a tar stream to extract files from the decompressed data
      const extract = tar.extract();
      const extractedFiles = [];

      extract.on("entry", (header, stream, next) => {
        let content = "";
        stream.on("data", (chunk) => {
          content += chunk.toString(); // accumulate the content
        });
        stream.on("end", () => {
          extractedFiles.push({
            name: header.name,
            content: content,
          });
          next();
        });
      });

      extract.on("finish", () => {
        console.log("Extracted files:", extractedFiles);

        if (extractedFiles.length > 0) {
          extractedFiles.forEach((file) => {
            // Create a Blob from the extracted file content
            const blob = new Blob([file.content], {
              type: "application/octet-stream",
            });

            // Create a download link for each file
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob); // Create an object URL for the Blob
            link.download = file.name; // Set the download file name

            // Automatically click the link to trigger the download
            link.click();
          });
        } else {
          throw new Error("No files extracted.");
        }
      });

      // Write the decompressed data to the tar extract stream
      extract.end(decompressedData);
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

// Make the function available globally
window.handleFileExtract = handleFileExtract;
