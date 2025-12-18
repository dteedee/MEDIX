import { apiClient } from "../lib/apiClient";
import { DoctorProfileDetails, DoctorProfileDto, DoctorRegisterMetadata, ServiceTierWithPaginatedDoctorsDto, PaginationParams, DoctorTypeDegreeDto, DoctorQueryParameters, DoctorQuery, DoctorList, DoctorDto, EducationGroupWithPaginatedDoctorsDto, DoctorPerformanceDto, DoctorProfileUpdateRequest } from "../types/doctor.types";

class DoctorService {
    async getDoctorProfile(doctorID: string | undefined): Promise<DoctorProfileDto> {
        try {
            const response = await apiClient.get<DoctorProfileDto>('/doctor/profile/' + doctorID);
        
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getDoctorProfileDetails(): Promise<DoctorProfileDetails> {
        const response = await apiClient.get<DoctorProfileDetails>('doctor/profile/details');
        return response.data;
    }

    async updateDoctorProfile(payload: DoctorProfileUpdateRequest): Promise<void> {
        await apiClient.put<any>('doctor/profile/update', payload);
    }

    async updateAvatar(payload: FormData): Promise<any> {
        const response = await apiClient.putMultipart<any>('doctor/profile/update-avatar', payload);
        return response.data;
    }


    async getDoctorsGroupedByTier(queryParams: DoctorQueryParameters): Promise<ServiceTierWithPaginatedDoctorsDto[]> {
        try {
            const response = await apiClient.get<ServiceTierWithPaginatedDoctorsDto[]>('/booking/by-tier', {
                params: queryParams
            });
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getEducationTypes(): Promise<DoctorTypeDegreeDto[]> {
        try {
            const response = await apiClient.get<DoctorTypeDegreeDto[]>('/doctor/education-type');
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getAll(query: DoctorQuery): Promise<DoctorList> {
        const response = await apiClient.get<DoctorList>('/doctor/all', {
            params: {
                page: query.page,
                searchTerm: query.searchTerm,
                pageSize: query.pageSize,
            },
        });
        return response.data;
    }

    async getById(id: string): Promise<DoctorDto> {
        const response = await apiClient.get<DoctorDto>(`/doctor/${id}`);
        return response.data;
    }

    async getMetadata(): Promise<DoctorRegisterMetadata> {
        try {
            const response = await apiClient.get<DoctorRegisterMetadata>('/DoctorRegistrationForm/register-metadata');
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getDoctorsGroupedByEducation(queryParams: DoctorQueryParameters): Promise<EducationGroupWithPaginatedDoctorsDto[]> {
        try {
            const response = await apiClient.get<EducationGroupWithPaginatedDoctorsDto[]>('/booking/grouped-by-education', {
                params: queryParams
            });
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getStatistics(id: string): Promise<any> {
        try {
            const response = await apiClient.get<any>(`/doctor/${id}/statistics`);
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async getTopDoctorsByPerformance(ratingWeight: number = 0.7, successWeight: number = 0.3): Promise<DoctorPerformanceDto[]> {
        try {
            const response = await apiClient.get<DoctorPerformanceDto[]>('/doctor/top/performance', {
                params: {
                    ratingWeight,
                    successWeight
                }
            });
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async updateDoctorEducationAndFee(doctorId: string, data: { education?: string, consultationFee?: number }): Promise<any> {
        try {
            const requestBody = {
                education: data.education || null,
                consultationFee: data.consultationFee || null
            };
            const response = await apiClient.put(`/doctor/${doctorId}/education-fee`, requestBody);
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    async updateDoctorCommissionRate(doctorId: string, data: { consultationFee?: number, commissionRate?: number }): Promise<any> {
        try {
            const requestBody = {
                consultationFee: data.consultationFee || null,
                commissionRate: data.commissionRate || null
            };
            const response = await apiClient.put(`/doctor/${doctorId}/commission-fee`, requestBody);
            return response.data;
        } catch (error: any) {
            throw this.handleApiError(error);
        }
    }

    private handleApiError(error: any): Error {
        if (error.response?.data) {
            const apiError = error.response.data;

            if (apiError.errors) {
                const errorMessages = Object.entries(apiError.errors)
                    .flat()
                    .filter(msg => typeof msg === 'string')
                    .join(', ');
                return new Error(errorMessages || apiError.message || 'Validation error');
            }

            return new Error(apiError.message || 'API error occurred');
        }

        return new Error(error.message || 'Network error occurred');
    }
}

export default new DoctorService();