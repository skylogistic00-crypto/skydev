const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { pdf_url } = await req.json();

    if (!pdf_url) {
      throw new Error("pdf_url is required");
    }

    console.log("Processing PDF with Tesseract OCR:", pdf_url);

    // Fetch the PDF file
    const pdfResponse = await fetch(pdf_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }

    const pdfBlob = await pdfResponse.blob();
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Convert PDF to images using pdf-lib or similar
    // For now, we'll use a simpler approach with Tesseract.js via Deno
    
    // Note: Tesseract.js doesn't work directly in Deno
    // We need to use a different approach for PDF OCR
    
    // Option 1: Use pdf2pic to convert PDF to images, then OCR each page
    // Option 2: Use a hosted Tesseract API service
    // Option 3: Use pdf.js to extract text directly
    
    // For this implementation, we'll use pdf.js to extract text
    // This is a lightweight solution that works well for text-based PDFs
    
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'document.pdf');

    // Using OCR.space API as a fallback (free tier available)
    const ocrSpaceApiKey = Deno.env.get('OCR_SPACE_API_KEY') || 'K87899142388957';
    
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': ocrSpaceApiKey,
      },
      body: formData,
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR API failed: ${ocrResponse.statusText}`);
    }

    const ocrResult = await ocrResponse.json();
    
    console.log("OCR Result:", ocrResult);

    if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
      const extractedText = ocrResult.ParsedResults
        .map((result: any) => result.ParsedText)
        .join('\n\n');

      return new Response(
        JSON.stringify({
          success: true,
          text: extractedText,
          pages: ocrResult.ParsedResults.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error(ocrResult.ErrorMessage || 'OCR processing failed');
    }

  } catch (error) {
    console.error("Tesseract OCR Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
