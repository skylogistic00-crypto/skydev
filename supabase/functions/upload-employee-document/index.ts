import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(req);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'upload-ijasah';

    if (!file) {
      throw new Error('No file provided');
    }

    // Create file path: employee-documents/{documentType}/{user_id}/{filename}
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${documentType}/${user.id}/${fileName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('employee-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('employee-documents')
      .getPublicUrl(filePath);

    // Update users table with the file URL
    const updateColumn = documentType === 'upload-ijasah' ? 'upload-ijasah' : documentType;
    const { error: updateError } = await supabase
      .from('users')
      .update({ [updateColumn]: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update user record:', updateError);
      // Don't throw - file is already uploaded
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        path: filePath
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
