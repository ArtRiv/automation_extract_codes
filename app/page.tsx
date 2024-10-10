"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import { Loader2, X } from "lucide-react";
import Loading from "./loading";
import { GithubIconComponent } from "@/components/github_icon";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [xlsxFile, setXlsxFile] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const numColumns = 5; // Set the number of columns

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

  // Generate the Excel file whenever the output changes
  useEffect(() => {
    if (output.length > 0) {
      const exportedFile = exportToExcel(output);
      setXlsxFile(exportedFile);
    } else {
      setXlsxFile(null);
    }
  }, [output]);

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

  // Function to handle code removal
  const handleRemoveCode = (codeToRemove: string) => {
    // Remove all instances of the code
    const updatedOutput = output.filter((code) => code !== codeToRemove);
    setOutput(updatedOutput);
  };

  // Prepare data for the table
  const tableData = [];
  const maxRows = 10; // Maximum number of rows
  for (let row = 0; row < maxRows; row++) {
    const rowData = [];
    for (let col = 0; col < numColumns; col++) {
      const index = row + col * maxRows;
      if (index < output.length) {
        rowData.push(output[index]);
      } else {
        rowData.push(null);
      }
    }
    tableData.push(rowData);
  }

  return (
    <div className="w-full h-full lg:grid lg:grid-cols-2 relative">
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
            <Suspense fallback={<Loading />}>
              <Button onClick={processFile} className="w-full" disabled={loading}>
                {loading ? (
                  <span>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> aguarde...
                  </span>
                ) : (
                  "Extrair códigos"
                )}
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
          <Table className="h-full w-full m-5 max-w-2xl">
            <TableCaption>Uma preview dos códigos extraídos.</TableCaption>
            <TableBody>
              {/* Render the table rows */}
              {tableData.map((rowData, rowIndex) => (
                <TableRow key={rowIndex}>
                  {rowData.map((code, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className="border dark:border-white border-black p-3"
                    >
                      {code ? (
                        <div className="flex items-center justify-between gap-2">
                          <span>{code}</span>
                          <Button
                            className="p-1 size-5 opacity-90"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCode(code)}
                          >
                            <X size={80}/>
                          </Button>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={numColumns} className="text-right">
                  Total: {output.length} {output.length === 1 ? "código" : "códigos"}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      <div className="flex justify-center items-center gap-1 absolute bottom-2 left-2">
        <p className="text-sm text-balance text-muted-foreground">Created by Arthur</p>
        <a target="_blank" href="https://github.com/ArtRiv">
          <GithubIconComponent />
        </a>
      </div>
    </div>
  );
}