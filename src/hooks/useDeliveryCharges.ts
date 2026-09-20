import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryCharges {
  inside: number;
  outside: number;
  insideLabel: string;
  outsideLabel: string;
}

const DEFAULTS: DeliveryCharges = {
  inside: 60,
  outside: 120,
  insideLabel: "Inside Chittagong",
  outsideLabel: "Outside Chittagong",
};

export const fetchDeliveryCharges = async (): Promise<DeliveryCharges> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "delivery_charge_inside",
      "delivery_charge_outside",
      "delivery_label_inside",
      "delivery_label_outside",
    ]);

  if (error || !data?.length) return DEFAULTS;

  const map: Record<string, any> = {};
  for (const row of data) {
    map[row.key] = row.value;
  }

  const insideAmount = typeof map["delivery_charge_inside"] === "number"
    ? map["delivery_charge_inside"]
    : Number(map["delivery_charge_inside"]);
  const outsideAmount = typeof map["delivery_charge_outside"] === "number"
    ? map["delivery_charge_outside"]
    : Number(map["delivery_charge_outside"]);

  const insideLabel = typeof map["delivery_label_inside"] === "string"
    ? map["delivery_label_inside"]
    : DEFAULTS.insideLabel;
  const outsideLabel = typeof map["delivery_label_outside"] === "string"
    ? map["delivery_label_outside"]
    : DEFAULTS.outsideLabel;

  return {
    inside: Number.isFinite(insideAmount) ? insideAmount : DEFAULTS.inside,
    outside: Number.isFinite(outsideAmount) ? outsideAmount : DEFAULTS.outside,
    insideLabel: insideLabel || DEFAULTS.insideLabel,
    outsideLabel: outsideLabel || DEFAULTS.outsideLabel,
  };
};

export const useDeliveryCharges = () => {
  return useQuery({
    queryKey: ["delivery-charges"],
    queryFn: fetchDeliveryCharges,
    staleTime: 60_000,
  });
};
