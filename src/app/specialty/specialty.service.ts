import { Service } from "typedi";
import { SpecialtyRepository } from "./specialty.repository";

@Service()
export class SpecialtyService {
  constructor(private specialtyRepository: SpecialtyRepository) {}

  async getAllSpecialties(): Promise<any[]> {
    return this.specialtyRepository.getAllSpecialties();
  }

  async associateDoctorSpecialties(
    doctorId: number,
    specialtyIds: number[]
  ): Promise<void> {
    return this.specialtyRepository.associateDoctorSpecialties(
      doctorId,
      specialtyIds
    );
  }

  async getDoctorsBySpecialty(specialtyId: number): Promise<any[]> {
    return this.specialtyRepository.getDoctorsBySpecialty(specialtyId);
  }
}
