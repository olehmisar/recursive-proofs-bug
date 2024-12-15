import { expect } from "chai";
import hre from "hardhat";
import os from "node:os";

it("proves and verifies on-chain", async () => {
  // Generate a proof
  const main = await getCircuit("main");
  const rec = await getCircuit("recursive");
  const input = { x: 1, y: 2 };
  const { witness } = await main.noir.execute(input);
  const mainProof = await main.backend.generateProof(witness);
  const mainArtifacts = await main.backend.generateRecursiveProofArtifacts(
    mainProof,
    mainProof.publicInputs.length,
  );

  const recursiveInputs = {
    verification_key: mainArtifacts.vkAsFields,
    proof: mainArtifacts.proofAsFields,
    public_inputs: [input.y],
    key_hash: mainArtifacts.vkHash,
  };

  console.log("recursiveInputs", recursiveInputs);

  const { witness: recWitness } = await rec.noir.execute(recursiveInputs);
  const recProof = await rec.backend.generateProof(recWitness);
  const result = await rec.backend.verifyProof(recProof);
  expect(result).to.eq(true);
});

async function getCircuit(name: string) {
  const { Noir } = await import("@noir-lang/noir_js");
  const { UltraPlonkBackend } = await import("@aztec/bb.js");
  const circuit = await hre.noir.getCircuitJson(name);
  const noir = new Noir(circuit);
  const backend = new UltraPlonkBackend(circuit.bytecode, {
    threads: os.cpus().length,
  });
  return { noir, backend };
}
