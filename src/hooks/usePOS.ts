import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface POSProduct {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  price: number;
  base_price: number;
  stock: number;
  unit: string;
}

export interface CartItem extends POSProduct {
  quantity: number;
  subtotal: number;
}

export interface CheckoutResult {
  success: boolean;
  transaction_number: string;
  transaction_id: string;
  total_amount: number;
  cogs: number;
  profit: number;
  receipt: ReceiptData;
}

export interface ReceiptData {
  transaction_number: string;
  transaction_id: string;
  date: string;
  items: {
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  total: number;
  payment_method: string;
  payment_amount: number;
  change: number;
  customer_name?: string;
  cogs: number;
  profit: number;
}

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<POSProduct | null>(null);
  const { toast } = useToast();

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scanBarcode = useCallback(
    async (barcode: string): Promise<POSProduct | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-pos-barcode-scan",
          {
            body: { barcode },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || "Failed to scan barcode");
        }

        const product: POSProduct = data.product;
        setLastScannedProduct(product);

        if (data.is_new_product) {
          toast({
            title: "Produk Baru",
            description: `Produk dengan barcode ${barcode} telah dibuat. Silakan edit harga.`,
          });
        } else {
          toast({
            title: "Produk Ditemukan",
            description: `${product.name} - Rp ${product.price.toLocaleString("id-ID")}`,
          });
        }

        return product;
      } catch (err: any) {
        console.error("Scan barcode error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal scan barcode",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const addToCart = useCallback(
    (product: POSProduct, quantity: number = 1) => {
      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex((item) => item.id === product.id);

        if (existingIndex >= 0) {
          // Product exists - increment quantity
          const updatedCart = [...prevCart];
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            quantity: updatedCart[existingIndex].quantity + quantity,
            subtotal: (updatedCart[existingIndex].quantity + quantity) * updatedCart[existingIndex].price,
          };
          return updatedCart;
        } else {
          // New product - add to cart
          return [
            ...prevCart,
            {
              ...product,
              quantity,
              subtotal: product.price * quantity,
            },
          ];
        }
      });

      toast({
        title: "Ditambahkan ke Keranjang",
        description: `${product.name} x${quantity}`,
      });
    },
    [toast]
  );

  const scanAndAddToCart = useCallback(
    async (barcode: string) => {
      const product = await scanBarcode(barcode);
      if (product) {
        addToCart(product, 1);
      }
    },
    [scanBarcode, addToCart]
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    );
  }, []);

  const updatePrice = useCallback((productId: string, price: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? { ...item, price, subtotal: price * item.quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const checkout = useCallback(
    async (
      paymentMethod: string,
      paymentAmount: number,
      customerName?: string,
      notes?: string
    ): Promise<CheckoutResult | null> => {
      if (cart.length === 0) {
        toast({
          title: "Error",
          description: "Keranjang kosong",
          variant: "destructive",
        });
        return null;
      }

      setIsLoading(true);
      try {
        const changeAmount = paymentAmount - totalAmount;

        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-pos-checkout",
          {
            body: {
              cart_items: cart.map((item) => ({
                product_id: item.id,
                sku: item.sku,
                name: item.name,
                price: item.price,
                base_price: item.base_price,
                quantity: item.quantity,
                unit: item.unit,
                subtotal: item.subtotal,
              })),
              total_amount: totalAmount,
              payment_method: paymentMethod,
              payment_amount: paymentAmount,
              change_amount: changeAmount,
              customer_name: customerName,
              notes,
            },
          }
        );

        if (error) {
          throw new Error(error.message);
        }

        if (!data.success) {
          throw new Error(data.error || "Checkout failed");
        }

        toast({
          title: "Checkout Berhasil",
          description: `No. Transaksi: ${data.transaction_number}`,
        });

        clearCart();
        return data as CheckoutResult;
      } catch (err: any) {
        console.error("Checkout error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal checkout",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [cart, totalAmount, toast, clearCart]
  );

  return {
    cart,
    totalAmount,
    totalItems,
    isLoading,
    lastScannedProduct,
    scanBarcode,
    addToCart,
    scanAndAddToCart,
    updateQuantity,
    updatePrice,
    removeFromCart,
    clearCart,
    checkout,
  };
}
