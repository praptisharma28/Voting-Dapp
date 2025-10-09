import { BankrunProvider, startAnchor } from "anchor-bankrun";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { VotingProgram } from "../target/types/voting_program";
import { expect } from "chai";
const IDL = require("../target/idl/voting_program.json");

const votingAddress = new PublicKey("4oXSgoQrEKy86yqeBx6poWcir92hLmG65pDhsue1REFk");

describe("voting-program", () => {
  // Configure the client to use the local cluster.

  let context;
  let provider;
  let votingProgram;

  beforeAll(() => {
    context = startAnchor("", [{name: "voting_program", programId: votingAddress}], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<VotingProgram>(IDL, provider);
  });

  it("Intialized poll!", async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favorite programming language?",
      new anchor.BN(0),
      new anchor.BN(1859951624),
  ).rpc();

  const [pollAddress] = PublicKey.findProgramAddressSync(
    [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
    votingAddress,
  );

  const poll = await votingProgram.account.poll.fetch(pollAddress);

  console.log(poll);

  expect(poll.pollId.toNumber()).to.equal(1);
  expect(poll.description).to.equal("What is your favorite programming language?");
  expect(poll.pollStart.toNumber()).to.be.lessThan(poll.pollEnd.toNumber());
  });

  it("Intialized candidate!", async () => {
    await votingProgram.methods.initializeCandidate(
      "Rust",
      new anchor.BN(1),
  ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Python",
      new anchor.BN(1),
  ).rpc();

  const [pythonAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("Python"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
    votingAddress,
  );

  const pythonCandidate = await votingProgram.account.candidate.fetch(pythonAddress);

  console.log(pythonCandidate);
  expect(pythonCandidate.candidateVotes.toNumber()).to.equal(0);

  const [rustAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("Rust"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
    votingAddress,
  );

  const rustCandidate = await votingProgram.account.candidate.fetch(rustAddress);

  console.log(rustCandidate);
  expect(rustCandidate.candidateVotes.toNumber()).to.equal(0);

  });

  it("Casted vote!", async () => {
    await votingProgram.methods.vote(
      "Rust",
      new anchor.BN(1),
    ).rpc();

    const [rustAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("Rust"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    );

    const rustCandidate = await votingProgram.account.candidate.fetch(rustAddress);

    console.log(rustCandidate);
    expect(rustCandidate.candidateVotes.toNumber()).to.equal(1);
  });

});
