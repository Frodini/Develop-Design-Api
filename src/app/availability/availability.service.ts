import { Service } from "typedi";
import { AvailabilityRepository } from "./availability.repository";
import { Availability } from "./availability.model";

@Service()
export class AvailabilityService {
  constructor(private availabilityRepository: AvailabilityRepository) {}

  async setAvailability(availability: Availability): Promise<void> {
    await this.availabilityRepository.setAvailability(availability);
  }

  async getAvailability(
    doctorId: number,
    date: string
  ): Promise<Availability | null> {
    return this.availabilityRepository.getAvailability(doctorId, date);
  }
}
