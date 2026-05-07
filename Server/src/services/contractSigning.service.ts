import { IContract } from '../models/Contract';

// MVP local signing; replace with DocuSign provider later.
export async function locallySignContract(contract: IContract): Promise<IContract> {
  if (contract.workerSigned && contract.companySigned && contract.status === 'active') {
    return contract;
  }

  const signedAt = new Date();

  contract.workerSigned = true;
  contract.companySigned = true;
  contract.workerSignedAt = contract.workerSignedAt ?? signedAt;
  contract.companySignedAt = contract.companySignedAt ?? signedAt;
  contract.status = 'active';

  await contract.save();
  return contract;
}
