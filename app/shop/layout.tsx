import '@/components/shop/ShopPromoBanner.module.css';
import { ShopPaymentGuard } from '@/components/auth/PaymentGuard';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopPaymentGuard>{children}</ShopPaymentGuard>;
}
