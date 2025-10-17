export interface SpecializationDto {
  id: string;
  name: string;
}

export interface DoctorRegisterMetadata{
  specializations: SpecializationDto[];
}