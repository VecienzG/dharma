import { gql } from '@apollo/client';

// Reference mutation for dharmaAiMemory update.
// Twenty generates the real mutation dynamically via useUpdateOneRecord.
export const UPDATE_DHARMA_MEMORY = gql`
  mutation UpdateDharmaAiMemory($id: ID!, $data: dharmaAiMemoryUpdateInput!) {
    updateDharmaAiMemory(id: $id, data: $data) {
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
