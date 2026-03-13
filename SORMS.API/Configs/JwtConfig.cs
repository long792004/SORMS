namespace SORMS.API.Configs
{
    public class JwtConfig
    {
        public string Key { get; set; }         // Khóa bí mật để ký token
        public string Issuer { get; set; }      // Tên đơn vị phát hành token
        public string Audience { get; set; }    // Đối tượng sử dụng token
        public int ExpireHours { get; set; }    // Thời gian hết hạn (giờ)
    }

}
