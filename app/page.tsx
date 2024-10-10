"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import { Loader2 } from "lucide-react";
import Loading from "./loading";


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [xlsxFile, setXlsxFile] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setLoading(true); // Set loading state to true

    try {
      const text = await file.text();
      const codes = extractCodes(text);
      setOutput(codes);
      const exportedFile = exportToExcel(codes);
      setXlsxFile(exportedFile);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const extractCodes = (text: string): string[] => {
    const regex = /\b[A-Z0-9]{10,}\b/g;
    return text.match(regex) || [];
  };

  const exportToExcel = (codes: string[]): string => {
    const worksheet = XLSX.utils.aoa_to_sheet(codes.map((code) => [code]));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Codes");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileUrl = URL.createObjectURL(blob);

    return fileUrl;
  };

  const handleDownload = () => {
    if (!xlsxFile) return;

    const link = document.createElement("a");
    link.href = xlsxFile;
    link.setAttribute("download", "extracted_codes.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableData = Array.from({ length: 10 }, (_, index) => ({
    code: output[index] || "",
  }));

  return (
    <div className="w-full h-full lg:grid lg:grid-cols-2">
      {/* Left Column - File Upload */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Anexar arquivo de texto</h1>
            <p className="text-balance text-muted-foreground">
              Anexe seu arquivo de texto para extrair os códigos para uma planilha excel
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2 cursor-pointer">
              <Label htmlFor="file-upload">Selecionar arquivo</Label>
              <Input id="file-upload" type="file" accept=".txt" onChange={handleFileChange} />
            </div>
            <Suspense fallback={<Loading/>}>
              <Button onClick={processFile} className="w-full" disabled={loading}>
                {loading 
                ? <span> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> aguarde... </span>  
                : "Extrair códigos"}
              </Button>
            </Suspense>
            {output.length > 0 && (
              <Button onClick={handleDownload} className="w-full mt-4">
                Baixar planilha
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Right Column - Table Display */}
      <div className="flex items-center justify-center bg-muted lg:block h-full">
        <div className="w-full p-4">
          <h2 className="text-2xl font-bold">Preview</h2>
          <Table className="h-full">
            <TableCaption>Uma preview dos códigos extraidos.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="border border-white p-3">{row.code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={1} className="text-right">
                  Total: {output.length} {output.length === 1 ? "código" : "códigos"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}