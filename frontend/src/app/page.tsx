"use client";
import { useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string>("paprika");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelName(event.target.value);
  };

console.log(modelName);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    formData.append("model_name", modelName);
    console.log(formData);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/predict/`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setOutputImage(imageObjectURL);
      } else {
        console.error("Failed to fetch the image");
      }
    } catch (error) {
      console.error("Error uploading the file", error);
    }
  };

  return (
    <main className="container mx-auto mt-20 p-5 ">
      <hgroup>
        <h1 className="m-4 text-center text-4xl font-bold">
          Image Style Transfer
        </h1>
      </hgroup>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <div>
          <label htmlFor="model_name">Choose a model: </label>
          <select
            id="model_name"
            value={modelName}
            onChange={handleModelChange}
          >
            <option value="paprika">Paprika</option>
            <option value="hayao">Hayao</option>
            <option value="shinkai">Shinkai</option>
            <option value="celeba">Celeba</option>
            <option value="face_paint">Face Paint</option>
          </select>
        </div>
        <button type="submit">Upload and Stylize</button>
      </form>
      <div className="flex justify-around">
        <div id="imagePreview" className="mb-4 mt-6">
          {imagePreviewUrl && (
            <div>
              <h2>Input Image</h2>
              <img
                className="rounded-md"
                src={imagePreviewUrl}
                alt="Preview"
                style={{ width: "300px", height: "300px" }}
              />
            </div>
          )}
        </div>
        <div id="imageOutput" className="mb-4 mt-6">
          {outputImage && (
            <div>
              <h2>Stylized Image</h2>
              <img
                className="rounded-md"
                src={outputImage}
                alt="Stylized Output"
                style={{ width: "300px", height: "300px" }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
