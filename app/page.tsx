import { Suspense } from "react";
import DingryShopPage from "@/components/dingry-shop-page";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <DingryShopPage />
    </Suspense>
  );
}
