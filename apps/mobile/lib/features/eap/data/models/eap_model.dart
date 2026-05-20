class EapResource {
  final String id, title, category;
  final String? description,
      providerName,
      contactEmail,
      contactPhone,
      websiteUrl;
  final bool isAnonymous;

  EapResource({
    required this.id,
    required this.title,
    required this.category,
    this.description,
    this.providerName,
    this.contactEmail,
    this.contactPhone,
    this.websiteUrl,
    required this.isAnonymous,
  });

  factory EapResource.fromJson(Map<String, dynamic> j) => EapResource(
        id: j['id'],
        title: j['title'],
        category: j['category'],
        description: j['description'],
        providerName: j['providerName'],
        contactEmail: j['contactEmail'],
        contactPhone: j['contactPhone'],
        websiteUrl: j['websiteUrl'],
        isAnonymous: j['isAnonymous'] ?? false,
      );
}
