"use client";

import { useEffect } from "react";
import { useNavigate } from "@/lib/react-router-compat";

export const MoMoCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/checkout", { replace: true });
  }, [navigate]);

  return null;
};

export default MoMoCallbackPage;
