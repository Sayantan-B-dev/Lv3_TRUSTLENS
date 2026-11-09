import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.create();

const REF = ethers.keccak256(ethers.toUtf8Bytes("trustlens.report/v1:demo:v1"));
const DIGEST = "0x" + "ab".repeat(32);
const DIGEST_2 = "0x" + "cd".repeat(32);

describe("ReportRegistry", function () {
  async function deploy() {
    const registry = await ethers.deployContract("ReportRegistry");
    await registry.waitForDeployment();
    return registry;
  }

  it("stores a digest and exposes it for independent verification", async function () {
    const registry = await deploy();
    await (await registry.register(REF, DIGEST)).wait();
    expect(await registry.getDigest(REF)).to.equal(DIGEST);
    expect(await registry.totalReports()).to.equal(1n);
  });

  it("emits ReportRegistered with the submitter and revision", async function () {
    const registry = await deploy();
    const [owner] = await ethers.getSigners();
    await expect(registry.register(REF, DIGEST))
      .to.emit(registry, "ReportRegistered")
      .withArgs(REF, DIGEST, owner.address, (value: bigint) => value > 0n, 1);
  });

  it("returns report metadata", async function () {
    const registry = await deploy();
    const [owner] = await ethers.getSigners();
    await (await registry.register(REF, DIGEST)).wait();
    const [digest, submitter, timestamp, revision] = await registry.getReport(REF);
    expect(digest).to.equal(DIGEST);
    expect(submitter).to.equal(owner.address);
    expect(timestamp).to.be.greaterThan(0n);
    expect(revision).to.equal(1n);
  });

  it("rejects a duplicate report reference", async function () {
    const registry = await deploy();
    await (await registry.register(REF, DIGEST)).wait();
    await expect(registry.register(REF, DIGEST_2)).to.be.revertedWithCustomError(
      registry,
      "AlreadyRegistered",
    );
  });

  it("rejects a zero digest", async function () {
    const registry = await deploy();
    await expect(registry.register(REF, ethers.ZeroHash)).to.be.revertedWithCustomError(
      registry,
      "ZeroDigest",
    );
  });

  it("restricts registration to the owner", async function () {
    const registry = await deploy();
    const [, stranger] = await ethers.getSigners();
    await expect(
      registry.connect(stranger).register(REF, DIGEST),
    ).to.be.revertedWithCustomError(registry, "Unauthorized");
  });

  it("supports an explicit ownership transfer", async function () {
    const registry = await deploy();
    const [, nextOwner] = await ethers.getSigners();
    await (await registry.transferOwnership(nextOwner.address)).wait();
    expect(await registry.owner()).to.equal(nextOwner.address);
    await expect(
      registry.register(REF, DIGEST),
    ).to.be.revertedWithCustomError(registry, "Unauthorized");
    await (await registry.connect(nextOwner).register(REF, DIGEST)).wait();
    expect(await registry.getDigest(REF)).to.equal(DIGEST);
  });

  it("returns zero for an unregistered reference", async function () {
    const registry = await deploy();
    expect(await registry.getDigest(REF)).to.equal(ethers.ZeroHash);
  });
});
