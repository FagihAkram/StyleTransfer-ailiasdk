"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string>("paprika");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedFile(file);
          setImagePreviewUrl(e.target.result as string);
        }
      };

      reader.onerror = () => {
        // Handle file read error (optional)
        console.error("File reading has failed");
      };

      reader.onabort = () => {
        // Handle file read abort (optional)
        console.warn("File reading was aborted");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleModelChange = (value: string) => {
    setModelName(value);
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
      <form
        className="flex max-w-[600px] justify-center duration-700 animate-in fade-in"
        onSubmit={handleSubmit}
      >
        <div className="mt-4 flex space-x-2">
          <Select onValueChange={handleModelChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paprika">Paprika</SelectItem>
              <SelectItem value="hayao">Hayao</SelectItem>
              <SelectItem value="shinkai">Shinkai</SelectItem>
              <SelectItem value="celeba">Celeba</SelectItem>
              <SelectItem value="face_paint">Face Paint</SelectItem>
            </SelectContent>
          </Select>

          <Input
            id="picture"
            type="file"
            onChange={handleFileChange}
            required
          />
          <Button type="submit">Upload and Stylize</Button>
        </div>
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
