export type AlertThresholdValues = {
  cpuThreshold: number;
  ramThreshold: number;
  diskThreshold: number;
};

export type AlertThresholdSettings = AlertThresholdValues & {
  customized: boolean;
};
