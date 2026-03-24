namespace SORMS.API.Configs
{
    public class CloudinaryConfig
    {
        public string CloudName { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ApiSecret { get; set; } = string.Empty;
        public string Folder { get; set; } = "sorms/rooms";
    }
}