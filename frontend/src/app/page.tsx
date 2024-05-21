"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClipLoader from "react-spinners/ClipLoader"; // Assuming you have a Spinner component

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

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
        console.error("File reading has failed");
      };

      reader.onabort = () => {
        console.warn("File reading was aborted");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleModelChange = (value: string) => {
    setModelName(value);
    setError(undefined); // Clear any existing error before starting the submission
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modelName) {
      setError("Please select a model before submitting.");
      return;
    }

    setLoading(true);
    setOutputImage(null); // Clear output image when loading starts
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
        setError(undefined); // Clear any existing error after successful submission
      } else {
        console.error("Failed to fetch the image");
      }
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto mt-10 flex flex-col items-center p-5">
      <hgroup>
        <h1 className="m-4 text-center text-4xl font-bold">
          Image Style Transfer
        </h1>
      </hgroup>
      <form
        className="flex max-w-[600px] flex-col items-center p-4 duration-700 animate-in fade-in"
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
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Stylize"}
          </Button>
        </div>
      </form>
      {error && <FormError message={error} />}
      <div className="flex space-x-4 p-4">
        <div
          id="imagePreview"
          className="min-w-96 max-w-96 rounded-md border-2 border-dashed p-4 text-center font-medium text-slate-400"
        >
          <h2 className="mb-2">Input Image</h2>
          {imagePreviewUrl && (
            <img
              className="mx-auto max-h-full max-w-full rounded-md border object-contain"
              src={imagePreviewUrl}
              alt="Preview"
            />
          )}
        </div>

        <div
          id="imageOutput"
          className="min-w-96 max-w-96 rounded-md border-2 border-dashed p-4 text-center font-medium text-slate-400"
        >
          <h2 className="mb-2">Stylized Image</h2>
          {loading && (
            <div className="flex h-full items-center justify-center">
              <ClipLoader color={"#94A3B8"} size={100} />{" "}
              {/* Assuming you have a Spinner component */}
            </div>
          )}
          {outputImage && !loading && (
            <img
              className="mx-auto max-h-full max-w-full rounded-md border object-contain"
              src={outputImage}
              alt="Stylized Output"
            />
          )}
        </div>
      </div>
    </main>
  );
}
