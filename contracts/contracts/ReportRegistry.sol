// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title TrustLens Report Registry
/// @notice Stores only a SHA-256 digest commitment for a TrustLens report.
/// @dev No URLs, messages, personal data or evidence bodies are stored on-chain.
contract ReportRegistry {
    struct Report {
        bytes32 digest;
        address submitter;
        uint64 timestamp;
        uint32 revision;
    }

    mapping(bytes32 => Report) private _reports;

    address public owner;
    uint256 public totalReports;

    event ReportRegistered(
        bytes32 indexed reportRef,
        bytes32 indexed digest,
        address indexed submitter,
        uint64 timestamp,
        uint32 revision
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error Unauthorized();
    error ZeroDigest();
    error ZeroReportRef();
    error AlreadyRegistered(bytes32 reportRef);
    error InvalidOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /// @notice Register a report commitment. Revisions use a new reportRef.
    function register(bytes32 reportRef, bytes32 digest) external onlyOwner {
        if (reportRef == bytes32(0)) revert ZeroReportRef();
        if (digest == bytes32(0)) revert ZeroDigest();
        if (_reports[reportRef].timestamp != 0) revert AlreadyRegistered(reportRef);

        _reports[reportRef] = Report({
            digest: digest,
            submitter: msg.sender,
            timestamp: uint64(block.timestamp),
            revision: 1
        });
        totalReports += 1;
        emit ReportRegistered(reportRef, digest, msg.sender, uint64(block.timestamp), 1);
    }

    /// @notice Returns the committed digest, or zero if never registered.
    function getDigest(bytes32 reportRef) external view returns (bytes32) {
        return _reports[reportRef].digest;
    }

    function getReport(
        bytes32 reportRef
    ) external view returns (bytes32 digest, address submitter, uint64 timestamp, uint32 revision) {
        Report memory report = _reports[reportRef];
        return (report.digest, report.submitter, report.timestamp, report.revision);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }
}
