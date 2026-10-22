// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CertiChain Perú - Plataforma de certificados verificables
/// @notice Las instituciones pagan una tarifa para registrarse como emisoras.
///         certHash  = código único del certificado (hash del PDF o de sus datos)
///         studentId = keccak256 del DNI del estudiante (nunca el DNI en texto)
contract CertiChain {
    struct Certificado {
        bytes32 studentId;
        string studentName;
        string courseName;
        string certificateType;
        uint256 issueDate;   // lo fija la blockchain
        address issuer;
        bool exists;
        bool revoked;
    }

    address public admin;                                        // plataforma CertiChain
    uint256 public tarifaRegistro = 0.001 ether;                 // en la moneda nativa de la red

    mapping(address => bool) public emisores;                    // instituciones habilitadas
    mapping(address => string) public nombreInstitucion;         // wallet => nombre
    mapping(bytes32 => Certificado) private certificados;        // certHash => certificado
    mapping(bytes32 => bytes32[]) private certsPorEstudiante;    // studentId => lista de certHash

    error NoAutorizado();
    error YaRegistrado();
    error NoExiste();
    error YaRevocado();
    error DireccionInvalida();
    error HashInvalido();
    error DatosIncompletos();
    error TarifaIncorrecta();
    error SinFondos();
    error TransferenciaFallida();

    event InstitucionRegistrada(address indexed institucion, string nombre, uint256 monto);
    event EmisorActualizado(address indexed emisor, bool autorizado);
    event CertificadoEmitido(
        bytes32 indexed certHash,
        bytes32 indexed studentId,
        string studentName,
        string courseName,
        string certificateType,
        address indexed issuer
    );
    event CertificadoRevocado(bytes32 indexed certHash, address indexed revokedBy);
    event TarifaActualizada(uint256 nuevaTarifa);
    event FondosRetirados(address indexed destino, uint256 monto);
    event AdminTransferido(address indexed anterior, address indexed nuevo);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NoAutorizado();
        _;
    }

    modifier onlyEmisor() {
        if (!emisores[msg.sender]) revert NoAutorizado();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registrarInstitucion(string calldata nombre) external payable {
        if (bytes(nombre).length == 0) revert DatosIncompletos();
        if (bytes(nombreInstitucion[msg.sender]).length != 0) revert YaRegistrado();
        if (msg.value != tarifaRegistro) revert TarifaIncorrecta();

        nombreInstitucion[msg.sender] = nombre;
        emisores[msg.sender] = true;

        emit InstitucionRegistrada(msg.sender, nombre, msg.value);
        emit EmisorActualizado(msg.sender, true);
    }

    function emitirCertificado(
        bytes32 certHash,
        bytes32 studentId,
        string calldata studentName,
        string calldata courseName,
        string calldata certificateType
    ) external onlyEmisor {
        if (certHash == bytes32(0) || studentId == bytes32(0)) revert HashInvalido();
        if (bytes(studentName).length == 0 || bytes(courseName).length == 0) revert DatosIncompletos();
        if (certificados[certHash].exists) revert YaRegistrado();

        certificados[certHash] = Certificado({
            studentId: studentId,
            studentName: studentName,
            courseName: courseName,
            certificateType: certificateType,
            issueDate: block.timestamp,
            issuer: msg.sender,
            exists: true,
            revoked: false
        });
        certsPorEstudiante[studentId].push(certHash);

        emit CertificadoEmitido(certHash, studentId, studentName, courseName, certificateType, msg.sender);
    }

    function revocarCertificado(bytes32 certHash) external {
        Certificado storage c = certificados[certHash];
        if (!c.exists) revert NoExiste();
        bool esEmisorVigente = (msg.sender == c.issuer && emisores[msg.sender]);
        if (msg.sender != admin && !esEmisorVigente) revert NoAutorizado();
        if (c.revoked) revert YaRevocado();

        c.revoked = true;
        emit CertificadoRevocado(certHash, msg.sender);
    }

    function setEmisor(address emisor, bool autorizado) external onlyAdmin {
        if (emisor == address(0)) revert DireccionInvalida();
        if (bytes(nombreInstitucion[emisor]).length == 0) revert NoExiste();
        emisores[emisor] = autorizado;
        emit EmisorActualizado(emisor, autorizado);
    }

    function setTarifa(uint256 nuevaTarifa) external onlyAdmin {
        tarifaRegistro = nuevaTarifa;
        emit TarifaActualizada(nuevaTarifa);
    }

    function retirarFondos() external onlyAdmin {
        uint256 monto = address(this).balance;
        if (monto == 0) revert SinFondos();
        (bool ok, ) = payable(admin).call{value: monto}("");
        if (!ok) revert TransferenciaFallida();
        emit FondosRetirados(admin, monto);
    }

    function transferirAdmin(address nuevo) external onlyAdmin {
        if (nuevo == address(0)) revert DireccionInvalida();
        emit AdminTransferido(admin, nuevo);
        admin = nuevo;
    }

    function verificarCertificado(bytes32 certHash)
        external
        view
        returns (bool valido, Certificado memory cert, string memory institucion)
    {
        cert = certificados[certHash];
        valido = cert.exists && !cert.revoked;
        institucion = nombreInstitucion[cert.issuer];
    }

    function getCertificadosPorEstudiante(bytes32 studentId)
        external
        view
        returns (bytes32[] memory)
    {
        return certsPorEstudiante[studentId];
    }

    function balanceContrato() external view returns (uint256) {
        return address(this).balance;
    }
}
