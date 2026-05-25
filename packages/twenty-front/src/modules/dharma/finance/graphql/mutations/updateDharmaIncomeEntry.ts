import { gql } from '@apollo/client';

export const UPDATE_DHARMA_INCOME_ENTRY = gql`
  mutation UpdateDharmaIncomeEntry(
    $id: UUID!
    $input: DharmaIncomeEntryUpdateInput!
  ) {
    updateDharmaIncomeEntry(id: $id, data: $input) {
      id
      splitConfig
      taxAmount {
        amountMicros
        currencyCode
      }
      beautifulLifeAmount {
        amountMicros
        currencyCode
      }
      personalAmount {
        amountMicros
        currencyCode
      }
    }
  }
`;
