class BaseSMSProvider:
    def send_otp(self, phone_number: str, otp: str) -> None:
        raise NotImplementedError


class NullSMSProvider(BaseSMSProvider):
    """Adapter placeholder for production SMS integration."""

    def send_otp(self, phone_number: str, otp: str) -> None:
        return None
