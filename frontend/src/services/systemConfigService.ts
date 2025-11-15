// src/services/systemConfigService.ts
import { apiClient } from "../lib/apiClient";

export const systemConfigService = {
  async getPasswordPolicy() {
    const res = await apiClient.get("/SystemConfiguration/password-policy");
    return res.data;
  }
};
