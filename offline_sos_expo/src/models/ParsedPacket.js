export class ParsedPacket {
  constructor({
    sender,
    rawBody,
    time,
    type,
    sessionId,
    messageId,
    deviceId,
    priority = 'CRITICAL',
    ttl = 10,
    lat,
    long,
    message,
    localMediaPath = '',
    isStructured = false,
    isSentByMe = false,
    status = 'PENDING',
  }) {
    this.sender = sender;
    this.rawBody = rawBody;
    this.time = time;
    this.type = type;
    this.sessionId = sessionId || messageId || `RG-${Date.now().toString().slice(-6)}`;
    this.messageId = messageId || this.sessionId;
    this.deviceId = deviceId || `DEV-${sender ? sender.slice(-4) : 'NODE'}`;
    this.priority = priority;
    this.ttl = parseInt(ttl, 10) || 10;
    this.lat = lat;
    this.long = long;
    this.message = message;
    this.localMediaPath = localMediaPath;
    this.isStructured = isStructured;
    this.isSentByMe = isSentByMe;
    this.status = status;
  }

  static fromString({ sender, rawBody, isSentByMe = false, localMediaPath = '', status = 'PENDING' }) {
    const now = new Date().toTimeString().substring(0, 8);
    if (!rawBody) {
      return new ParsedPacket({
        sender,
        rawBody: '',
        time: now,
        type: 'TXT',
        sessionId: '',
        lat: '',
        long: '',
        message: '',
        localMediaPath,
        isStructured: false,
        isSentByMe,
        status,
      });
    }

    const parts = rawBody.split('|');

    // RescueGrid Extended SOS Packet: SOS|SessionID|Lat|Long|EmergencyDetails|Priority|TTL|MessageID|DeviceID
    if (parts[0] === 'SOS' || parts[0] === 'ALT') {
      const sessionId = parts[1] || `RG-${Date.now().toString().slice(-6)}`;
      const lat = parts[2] || '';
      const long = parts[3] || '';
      const message = parts[4] || '';
      const priority = parts[5] || 'CRITICAL';
      const ttl = parts[6] ? parseInt(parts[6], 10) : 10;
      const messageId = parts[7] || sessionId;
      const deviceId = parts[8] || `DEV-${sender ? sender.slice(-4) : '1042'}`;

      return new ParsedPacket({
        sender,
        rawBody,
        time: now,
        type: parts[0],
        sessionId,
        messageId,
        deviceId,
        priority,
        ttl,
        lat,
        long,
        message,
        localMediaPath,
        isStructured: true,
        isSentByMe,
        status,
      });
    } else if (parts[0] === 'ACK') {
      // ACK Packet: ACK|MessageID|ReceiverID|RECEIVED
      return new ParsedPacket({
        sender,
        rawBody,
        time: now,
        type: 'ACK',
        sessionId: parts[1],
        messageId: parts[1],
        deviceId: parts[2] || sender,
        message: parts[3] || 'RECEIVED',
        lat: '',
        long: '',
        isStructured: true,
        isSentByMe,
        status: 'ACKNOWLEDGED',
      });
    } else if (parts.length >= 5) {
      return new ParsedPacket({
        sender,
        rawBody,
        time: now,
        type: parts[0],
        sessionId: parts[1],
        lat: parts[2],
        long: parts[3],
        message: parts.slice(4).join('|'),
        localMediaPath,
        isStructured: true,
        isSentByMe,
        status,
      });
    } else if (parts.length === 3 && (parts[0] === 'MEDIA' || parts[0] === 'MEDIA_PENDING')) {
      return new ParsedPacket({
        sender,
        rawBody,
        time: now,
        type: parts[0],
        sessionId: parts[1],
        lat: '',
        long: '',
        message: parts[2],
        localMediaPath,
        isStructured: true,
        isSentByMe,
        status,
      });
    } else if (parts.length >= 3 && parts[0] === 'TXT') {
      return new ParsedPacket({
        sender,
        rawBody,
        time: now,
        type: 'TXT',
        sessionId: parts[1],
        lat: '',
        long: '',
        message: parts.slice(2).join('|'),
        localMediaPath,
        isStructured: true,
        isSentByMe,
        status,
      });
    }

    return new ParsedPacket({
      sender,
      rawBody,
      time: now,
      type: 'TXT',
      sessionId: '',
      lat: '',
      long: '',
      message: rawBody,
      localMediaPath,
      isStructured: false,
      isSentByMe,
      status,
    });
  }

  get hasCoordinates() {
    return (
      this.lat &&
      this.long &&
      !isNaN(parseFloat(this.lat)) &&
      !isNaN(parseFloat(this.long))
    );
  }

  get parsedLat() {
    return parseFloat(this.lat) || 0.0;
  }

  get parsedLng() {
    return parseFloat(this.long) || 0.0;
  }

  getDistanceTo(deviceLat, deviceLng) {
    if (!this.hasCoordinates || deviceLat == null || deviceLng == null) return 0.0;

    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a =
      0.5 -
      c((this.parsedLat - deviceLat) * p) / 2 +
      (c(deviceLat * p) *
        c(this.parsedLat * p) *
        (1 - c((this.parsedLng - deviceLng) * p))) /
        2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
  }
}
