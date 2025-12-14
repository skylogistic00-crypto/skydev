import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HSCodeResult {
  id: string;
  hs_code: string;
  description: string;
  category: string;
  sub_category: string;
  similarity: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function HSCodeAssistant() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HSCodeResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        'supabase-functions-generate-embedding',
        {
          body: { text: query },
        }
      );

      if (embeddingError) throw embeddingError;

      const { data: searchData, error: searchError } = await supabase.functions.invoke(
        'supabase-functions-search-hs-codes',
        {
          body: { 
            embedding: embeddingData.embedding,
            limit: 10 
          },
        }
      );

      if (searchError) throw searchError;

      setResults(searchData.results || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Terjadi kesalahan saat mencari HS Code');
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: query };
    setChatMessages(prev => [...prev, newMessage]);
    setQuery('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'supabase-functions-chat-hs-code',
        {
          body: { 
            messages: [...chatMessages, newMessage],
            userId: user?.id 
          },
        }
      );

      if (error) throw error;

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Terjadi kesalahan saat berkomunikasi dengan AI');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Asisten HS Code AI</CardTitle>
            <CardDescription>
              Cari kode HS dengan pencarian semantik atau tanyakan langsung ke AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === 'search' ? 'default' : 'outline'}
                onClick={() => setActiveTab('search')}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Pencarian Semantik
              </Button>
              <Button
                variant={activeTab === 'chat' ? 'default' : 'outline'}
                onClick={() => setActiveTab('chat')}
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat dengan AI
              </Button>
            </div>

            {activeTab === 'search' ? (
              <div>
                <div className="flex gap-2 mb-4">
                  <Textarea
                    placeholder="Contoh: Laptop gaming dengan processor Intel Core i7..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || !query.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Cari HS Code
                    </>
                  )}
                </Button>

                {results.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-lg">Hasil Pencarian:</h3>
                    {results.map((result) => (
                      <Card key={result.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge variant="default" className="text-lg mb-2">
                                {result.hs_code}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                {result.category} → {result.sub_category}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {(result.similarity * 100).toFixed(1)}% match
                            </Badge>
                          </div>
                          <p className="text-gray-800">{result.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-white border rounded-lg p-4 mb-4 h-96 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Mulai percakapan dengan menanyakan tentang HS Code</p>
                      <p className="text-sm mt-2">
                        Contoh: "Saya ingin mengimpor laptop gaming, kode HS apa yang cocok?"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tanyakan tentang HS Code..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                    className="flex-1"
                    rows={2}
                  />
                  <Button 
                    onClick={handleChat} 
                    disabled={chatLoading || !query.trim()}
                  >
                    {chatLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Kirim'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
