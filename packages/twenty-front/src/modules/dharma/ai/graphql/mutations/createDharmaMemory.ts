import { gql } from '@apollo/client';

// Reference mutation for dharmaAiMemory creation.
// Twenty generates the real mutation dynamically via useCreateOneRecord.
export const CREATE_DHARMA_MEMORY = gql`
  mutation CreateDharmaAiMemory($data: dharmaAiMemoryCreateInput!) {
    createDharmaAiMemory(data: $data) {
      id
      kind
      content
      tags
      score
      lastUsedAt
      source
    }
  }
`;
