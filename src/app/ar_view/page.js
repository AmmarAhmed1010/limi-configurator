"use client";

import SavedConfigurations from "../portal/components/dashboard/SavedConfigurations";

export default function ARViewPage() {
  return (
    <div className="min-h-screen flex justify-center items-center bg-black">
      <SavedConfigurations isARView={true} />
    </div>
  );
}
