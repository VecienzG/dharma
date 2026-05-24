import { Injectable, Logger } from '@nestjs/common';

import { Client } from 'pg';

import {
  BielleAccountingRow,
  BielleContactRow,
  BielleOrganizationRow,
  BielleProjectRow,
} from 'src/modules/dharma/migration/types/dharma-migration.types';

@Injectable()
export class DharmaBielleCrmSourceService {
  private readonly logger = new Logger(DharmaBielleCrmSourceService.name);

  async withClient<T>(
    sourceUrl: string,
    fn: (client: Client) => Promise<T>,
  ): Promise<T> {
    const client = new Client({
      connectionString: sourceUrl,
      ssl: sourceUrl.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    await client.connect();
    try {
      return await fn(client);
    } finally {
      await client.end();
    }
  }

  async fetchOrganizations(
    client: Client,
    since: Date | null,
  ): Promise<BielleOrganizationRow[]> {
    const params: unknown[] = [];
    let sinceFilter = '';
    if (since) {
      params.push(since);
      sinceFilter = ` WHERE "updatedAt" >= $1`;
    }
    const { rows } = await client.query<BielleOrganizationRow>(
      `SELECT id, name, company, type, status, "vatNumber", notes
       FROM "ClientOrganization"${sinceFilter}
       ORDER BY "createdAt" ASC`,
      params,
    );
    return rows;
  }

  async fetchContacts(
    client: Client,
    since: Date | null,
  ): Promise<BielleContactRow[]> {
    const params: unknown[] = [];
    let sinceFilter = '';
    if (since) {
      params.push(since);
      sinceFilter = ` WHERE "updatedAt" >= $1`;
    }
    const { rows } = await client.query<BielleContactRow>(
      `SELECT id, name, company, email, phone, type, status, "vatNumber", notes
       FROM "Contact"${sinceFilter}
       ORDER BY "createdAt" ASC`,
      params,
    );
    return rows;
  }

  async fetchProjects(
    client: Client,
    since: Date | null,
  ): Promise<BielleProjectRow[]> {
    const params: unknown[] = [];
    let sinceFilter = '';
    if (since) {
      params.push(since);
      sinceFilter = ` WHERE "updatedAt" >= $1`;
    }
    const { rows } = await client.query<BielleProjectRow>(
      `SELECT id, name, status, "clientOrganizationId", "clientContactId",
              budget::text AS budget,
              "startDate", "endDate", notes, tags
       FROM "Project"${sinceFilter}
       ORDER BY "createdAt" ASC`,
      params,
    );
    return rows;
  }

  async fetchAccounting(
    client: Client,
    since: Date | null,
    typeFilter: 'INCOME' | 'EXPENSE',
  ): Promise<BielleAccountingRow[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (typeFilter === 'INCOME') {
      conditions.push(`"type" IN ('ENTRATA_FATTURA','ENTRATA_CONTANTI')`);
    } else {
      conditions.push(`"type" IN ('USCITA','USCITA_CONTANTI','USCITA_CARTA')`);
    }

    if (since) {
      params.push(since);
      conditions.push(`"updatedAt" >= $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await client.query<BielleAccountingRow>(
      `SELECT id, type, status, description,
              "grossAmount"::text AS "grossAmount",
              "taxPct"::text AS "taxPct",
              "beautifulLifePct"::text AS "beautifulLifePct",
              "isCustomSplit", "date", "paidAt", category, "serviceTag",
              notes, "projectId", "contactId"
       FROM "Accounting" ${where}
       ORDER BY "date" ASC`,
      params,
    );
    return rows;
  }
}
