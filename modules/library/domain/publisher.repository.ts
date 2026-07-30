import type { PublisherEntity } from "./publisher.entity";

export interface CreatePublisherInput {
  tenantId: string;
  schoolId: string;
  name: string;
  createdBy?: string | null;
}

export interface UpdatePublisherInput {
  name?: string;
  isActive?: boolean;
  updatedBy?: string | null;
}

export interface PublisherRepository {
  findById(tenantId: string, id: string): Promise<PublisherEntity | null>;
  findMany(tenantId: string, filter?: { isActive?: boolean }): Promise<PublisherEntity[]>;
  create(input: CreatePublisherInput): Promise<PublisherEntity>;
  update(tenantId: string, id: string, input: UpdatePublisherInput): Promise<PublisherEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<PublisherEntity>;
}
