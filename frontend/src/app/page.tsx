"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"



export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string>("");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    formData.append("model_name", modelName);

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
    <main className="container mx-auto mt-20 p-5">
      <hgroup>
        <h1 className="m-4 text-center text-4xl font-bold">
          Image Style Transfer
        </h1>
      </hgroup>
      <form className="flex justify-center duration-700 animate-in fade-in max-w-[600px]" onSubmit={handleSubmit}>
        <div className="flex space-x-2 mt-4">
          
        <Select>
            <SelectTrigger className="w-[220px]" value={modelName}>
              <SelectValue placeholder="Select Model" onChange={handleModelChange}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paprika">Paprika</SelectItem>
              <SelectItem value="hayao">Hayao</SelectItem>
              <SelectItem value="shinkai">Shinkai</SelectItem>
              <SelectItem value="celeba">Celeba</SelectItem>
              <SelectItem value="face_paint">Face Paint</SelectItem>
            </SelectContent>
          </Select>
{/* 
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
          </select> */}

          <Input id="picture" type="file" onChange={handleFileChange} required />
          <Button type="submit">Upload and Stylize</Button>
        </div>

        {/* <div className="flex justify-center mt-2">
          <Label className="text-sm mr-2" htmlFor="model_name">Choose a model: </Label>


        </div>
                 */}
        {/* <div id="imagePreview" className="mb-4 mt-2 flex justify-center">
          {imagePreviewUrl && (
            <div>
              <h2>Image Input</h2>
              <img
                className="rounded-md"
                src={imagePreviewUrl}
                alt="Preview"
                style={{ width: "300px", height: "300px" }}
              />
            </div>
          )}
        </div>


        <div className="flex justify-center mt-2">
         
        </div> */}

      </form>
      <div className=" ">
        <div id="imagePreview" className="mb-4 mt-6">
          {imagePreviewUrl && (
            <div>
              <h2>Input Image</h2>
              <img
                className="rounded-md"
                src={imagePreviewUrl}
                alt="Preview"
                style={{ width: "50%", height: "50%" }}
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
                style={{ width: "50%", height: "50%" }}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
